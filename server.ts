// server.ts
import express from 'express';
import { supabaseAdmin } from './services/supabaseAdminClient';

const app = express();
const router = express.Router();

// --- CORS Middleware ---
// Addresses potential 'Network Error' issues by handling browser preflight requests.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// --- UAZAPI Configuration ---
const UAZAPI_API_BASE = 'https://nerdrico.uazapi.com';
const UAZAPI_MASTER_TOKEN = 'FdxDsS0GRjF1I8AiS0KrUYfxDBRBlECt5eGRNM1xRPyEzfLQSi';

// --- Helper Functions ---
async function getCredentials(companyId: string): Promise<{ instanceId: string, token: string } | null> {
    const { data, error } = await supabaseAdmin.from('whatsapp_integrations').select('instance_name, api_key').eq('company_id', companyId).single();
    if (error && error.code !== 'PGRST116') console.error("Error starting connection via proxy:", error);
    if (error || !data || !data.api_key) return null;
    return { instanceId: data.instance_name, token: data.api_key };
}

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return new Promise<T>((resolve, reject) => {
        promise.then((v) => { clearTimeout(timer); resolve(v); })
               .catch((e) => { clearTimeout(timer); reject(e); });
    });
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

async function handleInvalidToken(companyId: string) {
    try {
        await supabaseAdmin.from('whatsapp_integrations').update({ status: 'disconnected', api_key: null, qr_code_base64: null, connected_at: null }).eq('company_id', companyId);
    } catch (e) {
        console.error('Error starting connection via proxy: failed to clear invalid token', (e as any)?.message);
    }
}

// --- API Routes ---

// Proxy for /instance/status
router.post('/status', async (req, res) => {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    try {
        const creds = await getCredentials(companyId);
        if (!creds?.token) {
             const { data } = await supabaseAdmin.from('whatsapp_integrations').select('status').eq('company_id', companyId).single();
             // Ensure we always return a valid JSON object with a 'connected' property
             const status = data?.status || 'disconnected';
             return res.json({ connected: status === 'connected' });
        }

        const response = await fetchWithTimeout(`${UAZAPI_API_BASE}/instance/status`, {
            method: 'GET',
            headers: { 'token': creds.token }
        });

        if (response.status === 401 || response.status === 403) {
            await handleInvalidToken(companyId);
            console.error('Error starting connection via proxy: invalid token on /status');
            return res.json({ connected: false });
        }
        
        if (!response.ok) {
            console.error(`[PROXY-ERROR] /status UAZAPI responded with ${response.status}`);
            return res.json({ connected: false });
        }
        
        const data = await response.json();
        const connected = typeof data?.connected === 'boolean'
            ? !!data.connected
            : (data?.status?.phone_connected ?? data?.status?.instance_connected ?? data?.phone_connected ?? data?.instance_connected ?? false);
        return res.json({ connected: !!connected });
    } catch (error: any) {
        const isAbort = error?.name === 'AbortError';
        console.error('Error starting connection via proxy:', isAbort ? 'timeout on /status' : error.message);
        res.status(500).json({ error: 'Failed to get status from UAZAPI' });
    }
});

// Proxy for /instance/init and /instance/connect
router.post('/start-connection', async (req, res) => {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
    
    const instanceName = `mordomozap-${companyId}`;

    try {
        const initPayload = { name: instanceName, systemName: "apilocal" };
        
        const initResponse = await fetchWithTimeout(`${UAZAPI_API_BASE}/instance/init`, {
            method: 'POST',
            headers: { 'admintoken': UAZAPI_MASTER_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify(initPayload)
        });

        if (!initResponse.ok) {
            const errorBody = await initResponse.text();
            console.error('Error starting connection via proxy:', `UAZAPI /init failed ${initResponse.status}: ${errorBody}`);
            return res.status(502).json({ error: 'UAZAPI init failure' });
        }
        
        const initResult = await initResponse.json();
        const instanceData = initResult.instance;
        if (!instanceData?.token || !instanceData?.name) throw new Error('Invalid response from UAZAPI /init');

        const connectResponse = await fetchWithTimeout(`${UAZAPI_API_BASE}/instance/connect`, {
            method: 'POST',
            headers: { 'token': instanceData.token }
        });
        
        if (connectResponse.status === 401 || connectResponse.status === 403) {
            console.error('Error starting connection via proxy: invalid token on /connect');
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        if (!connectResponse.ok) {
            const errorBody = await connectResponse.text();
            console.error('Error starting connection via proxy:', `UAZAPI /connect failed ${connectResponse.status}: ${errorBody}`);
            return res.status(502).json({ error: 'UAZAPI connect failure' });
        }
        
        const connectResult = await connectResponse.json();
        const qrBase64 = connectResult.base64;
        if (!qrBase64) throw new Error('Failed to get QR Code from UAZAPI /connect');

        const finalQrCode = qrBase64.includes(',') ? qrBase64.split(',')[1] : qrBase64;
        
        return res.json({
            instanceName: instanceData.name,
            apiKey: instanceData.token,
            qrCodeBase64: finalQrCode
        });

    } catch (error: any) {
        const isAbort = error?.name === 'AbortError';
        console.error('Error starting connection via proxy:', isAbort ? 'timeout on /start-connection' : error.message);
        res.status(500).json({ error: 'Failed to initialize UAZAPI instance' });
    }
});

// Proxy to reconnect existing instance (generate new QR)
router.post('/reconnect', async (req, res) => {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    try {
        const creds = await getCredentials(companyId);
        if (!creds?.token) {
            console.error('Error starting connection via proxy: missing credentials on /reconnect');
            return res.status(404).json({ error: 'Missing credentials' });
        }

        const connectResponse = await fetchWithTimeout(`${UAZAPI_API_BASE}/instance/connect`, {
            method: 'POST',
            headers: { 'token': creds.token }
        });

        if (connectResponse.status === 401 || connectResponse.status === 403) {
            await handleInvalidToken(companyId);
            console.error('Error starting connection via proxy: invalid token on /reconnect');
            return res.status(401).json({ error: 'Invalid token' });
        }

        if (!connectResponse.ok) {
            const errorBody = await connectResponse.text();
            console.error('Error starting connection via proxy:', `UAZAPI /connect failed ${connectResponse.status}: ${errorBody}`);
            return res.status(502).json({ error: 'UAZAPI connect failure' });
        }

        const connectResult = await connectResponse.json();
        const qrBase64 = connectResult.base64;
        if (!qrBase64) throw new Error('Failed to get QR Code on reconnect');
        const finalQrCode = qrBase64.includes(',') ? qrBase64.split(',')[1] : qrBase64;
        return res.json({ qrCodeBase64: finalQrCode });
    } catch (error: any) {
        const isAbort = error?.name === 'AbortError';
        console.error('Error starting connection via proxy:', isAbort ? 'timeout on /reconnect' : error.message);
        res.status(500).json({ error: 'Failed to reconnect UAZAPI instance' });
    }
});

// Proxy for /instance/logout
router.post('/disconnect', async (req, res) => {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    try {
        const creds = await getCredentials(companyId);
        if (creds) {
            await fetchWithTimeout(`${UAZAPI_API_BASE}/instance/logout`, {
                method: 'POST',
                headers: { 'token': creds.token }
            });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error starting connection via proxy:', error.message);
        console.warn('[PROXY-WARN] /disconnect failed, but proceeding');
        res.json({ success: true });
    }
});

// Proxy for /message/sendText
router.post('/send-test', async (req, res) => {
    const { companyId, to, message } = req.body;
    if (!companyId || !to || !message) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const creds = await getCredentials(companyId);
        if (!creds) throw new Error('Connection credentials not found.');
        
        const response = await fetchWithTimeout(`${UAZAPI_API_BASE}/message/sendText`, {
            method: 'POST',
            headers: { 'token': creds.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: to, message })
        });

        if (response.status === 401 || response.status === 403) {
            await handleInvalidToken(companyId);
            console.error('Error starting connection via proxy: invalid token on /send-test');
            return res.status(401).json({ error: 'Invalid token' });
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: response.statusText }));
            console.error('Error starting connection via proxy:', errorBody.error || `Failed with status ${response.status}`);
            return res.status(502).json({ error: errorBody.error || 'Failed to send test message' });
        }
        
        res.json({ success: true });
    } catch (error: any) {
        const isAbort = error?.name === 'AbortError';
        console.error('Error starting connection via proxy:', isAbort ? 'timeout on /send-test' : error.message);
        res.status(500).json({ error: 'Failed to send test message' });
    }
});

// Mount the router at the /api/uaz prefix
app.use('/api/uaz', router);

export default app;
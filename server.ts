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
    if (error && error.code !== 'PGRST116') console.error("Error fetching creds from server:", error);
    if (error || !data || !data.api_key) return null;
    return { instanceId: data.instance_name, token: data.api_key };
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

        const response = await fetch(`${UAZAPI_API_BASE}/instance/status`, {
            method: 'GET',
            headers: { 'token': creds.token }
        });

        if (!response.ok) {
            console.error(`[PROXY-ERROR] /status UAZAPI responded with ${response.status}`);
            return res.json({ connected: false });
        }
        
        const data = await response.json();
        return res.json(data);
    } catch (error: any) {
        console.error('[PROXY-ERROR] /status:', error.message);
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
        
        const initResponse = await fetch(`${UAZAPI_API_BASE}/instance/init`, {
            method: 'POST',
            headers: { 'admintoken': UAZAPI_MASTER_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify(initPayload)
        });

        if (!initResponse.ok) {
            const errorBody = await initResponse.text();
            throw new Error(`UAZAPI /init failed with status ${initResponse.status}: ${errorBody}`);
        }
        
        const initResult = await initResponse.json();
        const instanceData = initResult.instance;
        if (!instanceData?.token || !instanceData?.name) throw new Error('Invalid response from UAZAPI /init');

        const connectResponse = await fetch(`${UAZAPI_API_BASE}/instance/connect`, {
            method: 'POST',
            headers: { 'token': instanceData.token }
        });
        
        if (!connectResponse.ok) {
            const errorBody = await connectResponse.text();
            throw new Error(`UAZAPI /connect failed with status ${connectResponse.status}: ${errorBody}`);
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
        console.error('[PROXY-ERROR] /start-connection:', error.message);
        res.status(500).json({ error: 'Failed to initialize UAZAPI instance' });
    }
});

// Proxy for /instance/logout
router.post('/disconnect', async (req, res) => {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    try {
        const creds = await getCredentials(companyId);
        if (creds) {
            await fetch(`${UAZAPI_API_BASE}/instance/logout`, {
                method: 'POST',
                headers: { 'token': creds.token }
            });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.warn('[PROXY-WARN] /disconnect failed, but proceeding:', error.message);
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
        
        const response = await fetch(`${UAZAPI_API_BASE}/message/sendText`, {
            method: 'POST',
            headers: { 'token': creds.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: to, message })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorBody.error || `Failed with status ${response.status}`);
        }
        
        res.json({ success: true });
    } catch (error: any) {
        console.error('[PROXY-ERROR] /send-test:', error.message);
        res.status(500).json({ error: 'Failed to send test message' });
    }
});

// Mount the router at the /api/uaz prefix
app.use('/api/uaz', router);

export default app;
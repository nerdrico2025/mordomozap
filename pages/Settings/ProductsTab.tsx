import React from 'react';
import type { AgentConfig } from '../../types';
import Button from '../../components/Button';


interface ProductsTabProps {
    config: AgentConfig;
    setConfig: React.Dispatch<React.SetStateAction<AgentConfig | null>>;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ config, setConfig }) => {

    const handleProductChange = (index: number, field: 'name' | 'price' | 'duration', value: string) => {
        if (!config) return;
        const newProducts = [...config.products];
        (newProducts[index] as any)[field] = value;
        setConfig({ ...config, products: newProducts });
    };

    const addProduct = () => {
        if (!config) return;
        setConfig({ ...config, products: [...config.products, { name: '', price: '', duration: 30 }] });
    };

    const removeProduct = (index: number) => {
        if (!config) return;
        const newProducts = config.products.filter((_, i) => i !== index);
        setConfig({ ...config, products: newProducts });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
                Cadastre os produtos ou serviços que sua empresa oferece. O assistente usará esta lista para agendamentos e para responder clientes.
            </p>
            {config.products.length > 0 ? (
                config.products.map((product, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50/50">
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600">Nome do Produto/Serviço</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Corte de Cabelo"
                                    value={product.name}
                                    onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Preço</label>
                                <input
                                    type="text"
                                    placeholder="R$ 50,00"
                                    value={product.price}
                                    onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">Duração (min)</label>
                                <input
                                    type="number"
                                    placeholder="30"
                                    value={product.duration}
                                    onChange={(e) => handleProductChange(index, 'duration', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            aria-label="Remover Produto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-500">
                    <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 18v-6a8 8 0 1 0-16 0v6h16z"></path><path d="M12 4V2"></path><path d="M20 18H4"></path></svg>
                    <p className="mt-2 font-semibold">Nenhum serviço cadastrado</p>
                    <p className="text-sm">Clique no botão abaixo para começar.</p>
                </div>
            )}
            <div className="pt-2">
                <Button onClick={addProduct} variant="secondary">Adicionar Serviço</Button>
            </div>
        </div>
    );
};

export default ProductsTab;

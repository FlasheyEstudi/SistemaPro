
import React, { useState, useRef } from 'react';
import { Upload, Link, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (data: string) => void;
  label: string;
  shape?: 'circle' | 'rect';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageChange, label, shape = 'rect' }) => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit 2MB for demo
        alert("El archivo es demasiado grande (Máx 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onImageChange(urlInput);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      
      <div className="flex gap-4 items-start">
        {/* Preview */}
        <div className={`shrink-0 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden relative
            ${shape === 'circle' ? 'w-24 h-24 rounded-full' : 'w-40 h-24 rounded-xl'}`}>
            {currentImage ? (
                <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
                <ImageIcon className="text-gray-300" size={32} />
            )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
            <div className="flex gap-2 text-xs">
                <button 
                    onClick={() => setMode('file')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === 'file' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                    Subir Archivo
                </button>
                <button 
                    onClick={() => setMode('url')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === 'url' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                    Enlace URL
                </button>
            </div>

            {mode === 'file' ? (
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors"
                    >
                        <Upload size={14} /> Seleccionar Imagen
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1">Formatos: JPG, PNG. Máx 2MB.</p>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://ejemplo.com/foto.jpg"
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 text-gray-900"
                    />
                    <button 
                        onClick={handleUrlSubmit}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    >
                        <Link size={14} />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;

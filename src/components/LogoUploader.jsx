import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, X, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function resolveObjectUrl(path) {
  if (!path) return null;
  if (path.startsWith('data:image/')) return path;
  if (!path.startsWith('/objects/')) return path;
  
  const host = window.location.hostname;
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://localhost:3001${path}`;
  }
  
  return `/api${path}`;
}

export function LogoUploader({ 
  empresaId, 
  currentLogo, 
  empresaNome,
  onUploadComplete,
  size = "lg"
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const getLogoUrl = (logoPath) => {
    return resolveObjectUrl(logoPath);
  };

  const getInitials = (name) => {
    if (!name) return "E";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFileExtension = (file) => {
    const type = file.type;
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    return extensions[type] || 'png';
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Use JPG, PNG, GIF ou WebP.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    try {
      const ext = getFileExtension(file);
      const uploadUrlResponse = await fetch(`/api/empresas/${empresaId}/logo/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileExtension: ext })
      });

      if (!uploadUrlResponse.ok) {
        const error = await uploadUrlResponse.json();
        throw new Error(error.error || 'Falha ao obter URL de upload');
      }

      const { uploadURL, objectPath } = await uploadUrlResponse.json();

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload da imagem');
      }

      const updateResponse = await fetch(`/api/empresas/${empresaId}/logo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          logoPath: objectPath,
          logoURL: uploadURL.split('?')[0]
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Falha ao salvar logo');
      }

      const updatedEmpresa = await updateResponse.json();
      
      toast({
        title: "Logo atualizado",
        description: "Sua logo foi salva com sucesso.",
      });

      onUploadComplete?.(updatedEmpresa);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer o upload da imagem.",
        variant: "destructive"
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    setUploading(true);
    try {
      const updateResponse = await fetch(`/api/empresas/${empresaId}/logo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoPath: null })
      });

      if (!updateResponse.ok) {
        throw new Error('Falha ao remover logo');
      }

      const updatedEmpresa = await updateResponse.json();
      setPreviewUrl(null);
      
      toast({
        title: "Logo removido",
        description: "A logo foi removida com sucesso.",
      });

      onUploadComplete?.(updatedEmpresa);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a logo.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-28 w-28"
  };

  const displayUrl = previewUrl || getLogoUrl(currentLogo);
  const hasLogo = !!displayUrl;

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-purple-200`}>
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt={empresaNome || "Logo"} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 text-xl font-semibold">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            ) : (
              <Camera className="h-8 w-8 text-purple-300" />
            )}
          </AvatarFallback>
        </Avatar>
        
        {hasLogo && !uploading && (
          <button
            onClick={handleRemoveLogo}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            data-testid="button-remove-logo"
            title="Remover logo"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          id="logo-upload"
          data-testid="input-logo-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
          data-testid="button-upload-logo"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {hasLogo ? "Alterar logo" : "Enviar logo"}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF ou WebP. Máximo 5MB.
        </p>
      </div>
    </div>
  );
}

export function EmpresaLogo({ logo, nome, size = "sm", className = "" }) {
  const getInitials = (name) => {
    if (!name) return "E";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  const logoUrl = resolveObjectUrl(logo);

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt={nome || "Logo"} 
        className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center`}>
      <span className={`text-purple-600 font-medium ${textSizeClasses[size]}`}>
        {getInitials(nome)}
      </span>
    </div>
  );
}

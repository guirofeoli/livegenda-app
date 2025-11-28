import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function ConfirmacaoSection({ formData, onUpdateFormData }) {
  return (
    <div className="bg-white rounded-xl border border-purple-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Confirmação e Observações
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="whatsapp"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Enviar confirmação via WhatsApp
          </label>
          <Switch
            id="whatsapp"
            checked={formData.enviar_whatsapp}
            onCheckedChange={(checked) =>
              onUpdateFormData({ ...formData, enviar_whatsapp: checked })
            }
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <label
            htmlFor="google"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Sincronizar com Google Calendar
          </label>
          <Switch
            id="google"
            checked={formData.sincronizar_google}
            onCheckedChange={(checked) =>
              onUpdateFormData({ ...formData, sincronizar_google: checked })
            }
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes" className="text-gray-700">
            Observações (opcional)
          </Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) =>
              onUpdateFormData({ ...formData, observacoes: e.target.value })
            }
            placeholder="Ex: cliente tem preferência por produtos sem cheiro."
            rows={4}
            className="border-purple-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
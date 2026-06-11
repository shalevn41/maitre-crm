import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function WaiterQRDialog({ waiter, restaurant, onClose }) {
  const canvasRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [waiterPhone, setWaiterPhone] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);

  useEffect(() => {
    if (waiter && restaurant) {
      generateQR();
    }
  }, [waiter, restaurant]);

  const generateQR = async () => {
    if (!waiter || !restaurant) return;
    
    // Use restaurant ID instead of slug to ensure it always works
    const signupUrl = `${window.location.origin}${createPageUrl('CustomerSignup')}?restaurant=${restaurant.id}&waiter=${waiter.id}`;
    
    try {
      const dataUrl = await QRCode.toDataURL(signupUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('שגיאה ביצירת QR');
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `waiter-qr-${waiter.name.replace(/\s+/g, '-')}.png`;
    link.click();
    toast.success('קוד QR הורד בהצלחה!');
  };

  const handleSendSMS = async () => {
    if (!waiterPhone.trim()) {
      toast.error('אנא הזן מספר טלפון');
      return;
    }

    setSendingSMS(true);
    try {
      const signupUrl = `${window.location.origin}${createPageUrl('CustomerSignup')}?restaurant=${restaurant.id}&waiter=${waiter.id}`;
      
      await base44.integrations.Core.SendEmail({
        to: restaurant.owner_email,
        subject: `קוד QR למלצר ${waiter.name}`,
        body: `שלום,\n\nקוד ה-QR למלצר ${waiter.name} מוכן לשימוש.\n\nקישור להרשמה: ${signupUrl}\n\nנא להעביר למלצר בטלפון: ${waiterPhone}`
      });
      
      toast.success('הודעה נשלחה בהצלחה!');
      onClose();
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('שגיאה בשליחת ההודעה');
    } finally {
      setSendingSMS(false);
    }
  };

  return (
    <Dialog open={!!waiter} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>קוד QR למלצר {waiter?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {qrDataUrl ? (
            <div className="flex flex-col items-center">
              <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 border-2 border-gray-200 rounded-lg" />
              <p className="text-sm text-gray-500 mt-3 text-center">
                סרוק קוד זה להרשמת לקוחות עבור {waiter?.name}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="waiter-phone">טלפון המלצר (לשליחת SMS)</Label>
            <Input
              id="waiter-phone"
              type="tel"
              value={waiterPhone}
              onChange={(e) => setWaiterPhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={!qrDataUrl}
          >
            <Download className="w-4 h-4 ml-2" />
            הורד QR
          </Button>
          <Button 
            onClick={handleSendSMS}
            disabled={!waiterPhone.trim() || sendingSMS}
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
          >
            {sendingSMS ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 ml-2" />
                שלח ב-SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
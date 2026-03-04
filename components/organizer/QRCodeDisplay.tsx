'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Printer, Copy, Check } from 'lucide-react';

interface QRCodeDisplayProps {
  joinCode: string;
  tournamentName: string;
}

export function QRCodeDisplay({ joinCode, tournamentName }: QRCodeDisplayProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  // Resolve origin only on the client to avoid SSR/hydration mismatch
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Base URL for spectators — they must enter the join code on the entry page.
  // QR code and shared link point here so code is always required.
  const spectatorEntryUrl = `${origin}/spectator/view`;

  const handleDownload = useCallback(() => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournamentName.replace(/\s+/g, '-')}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tournamentName]);

  const handlePrint = useCallback(() => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${tournamentName} - QR Code</title></head>
      <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0">
        <div style="text-align:center">
          <h2>${tournamentName}</h2>
          <p>Join Code: ${joinCode}</p>
          ${svg.outerHTML}
          <p style="margin-top:16px;color:#666">Scan and enter code to view the bracket</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [tournamentName, joinCode]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(spectatorEntryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spectator Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center" ref={svgRef}>
          <QRCodeSVG
            value={spectatorEntryUrl}
            size={200}
            level="M"
            includeMargin
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Join Code</p>
          <p className="text-2xl font-bold tracking-widest">{joinCode}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Spectators visit this URL and enter the join code above.
        </p>
        <div className="flex items-center gap-2">
          <Input value={spectatorEntryUrl} readOnly className="text-xs" />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

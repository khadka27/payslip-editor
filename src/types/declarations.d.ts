declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string, options?: any): void;
}

declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toDataURL(text: string, options: any, callback: (err: Error | null, url: string) => void): void;
}

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * PDF Generation & Sharing Helper
 * Utilities for capturing DOM elements as PDF and sharing/downloading via Capacitor APIs
 */

/**
 * Convert Blob to Base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:*/*;base64, prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Capture DOM element and convert to PDF
 * @param elementId - ID of the element to capture
 * @returns PDF blob
 */
export const generatePDFBlob = async (elementId: string): Promise<Blob> => {
    console.log('[PDF Helper] Starting PDF generation for element:', elementId);

    // 1. Get the element
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
    }

    console.log('[PDF Helper] Element found, capturing as PNG...');

    // 2. Capture as PNG (high quality)
    const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2, // 2x for crisp text
        backgroundColor: '#ffffff',
        width: 794, // A4 width at 96 DPI (210mm)
        height: 1123 // A4 height at 96 DPI (297mm)
    });

    console.log('[PDF Helper] PNG captured, converting to PDF...');

    // 3. Create PDF from image
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Add image to PDF (full page)
    pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);

    console.log('[PDF Helper] PDF created');

    // 4. Generate blob
    const pdfBlob = pdf.output('blob');
    console.log('[PDF Helper] PDF Blob size:', pdfBlob.size, 'bytes');

    return pdfBlob;
};

/**
 * Download PDF directly to device
 * @param elementId - ID of the element to capture
 * @param fileName - Name for the saved file (without extension)
 */
export const downloadPDF = async (elementId: string, fileName: string): Promise<void> => {
    try {
        console.log('[PDF Helper] Starting download...');

        // 1. Generate PDF
        const pdfBlob = await generatePDFBlob(elementId);

        // 2. Convert to base64
        const base64Data = await blobToBase64(pdfBlob);

        // 3. Save to Downloads directory
        const savedFile = await Filesystem.writeFile({
            path: `${fileName}.pdf`,
            data: base64Data,
            directory: Directory.Documents // Android saves to Documents folder
        });

        console.log('[PDF Helper] PDF saved to:', savedFile.uri);
        alert(`PDF guardado en Documents/${fileName}.pdf`);

    } catch (error: any) {
        console.error('[PDF Helper] Download ERROR:', error);
        throw new Error(`Error al descargar PDF: ${error.message}`);
    }
};

/**
 * Share PDF via Android native dialog
 * @param elementId - ID of the element to capture
 * @param fileName - Name for the saved file (without extension)
 * @param title - Share dialog title
 */
export const sharePDF = async (
    elementId: string,
    fileName: string,
    title: string
): Promise<void> => {
    try {
        console.log('[PDF Helper] Starting share...');

        // 1. Generate PDF
        const pdfBlob = await generatePDFBlob(elementId);

        // 2. Convert to base64
        const base64Data = await blobToBase64(pdfBlob);

        // 3. Save to temp cache
        const savedFile = await Filesystem.writeFile({
            path: `${fileName}.pdf`,
            data: base64Data,
            directory: Directory.Cache
        });

        console.log('[PDF Helper] Temp PDF created:', savedFile.uri);

        // 4. Share via native Android dialog
        await Share.share({
            title: title,
            text: `Reporte técnico generado por MINREPORT Stockpile Control`,
            url: savedFile.uri,
            dialogTitle: title
        });

        console.log('[PDF Helper] Share dialog opened successfully');

    } catch (error: any) {
        console.error('[PDF Helper] Share ERROR:', error);
        throw new Error(`Error al compartir PDF: ${error.message}`);
    }
};

/**
 * Check if Share API is available
 */
export const isShareAvailable = async (): Promise<boolean> => {
    try {
        const result = await Share.canShare();
        return result.value;
    } catch {
        return false;
    }
};

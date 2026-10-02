export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
  if (typeof content !== 'string') {
    return { success: false, error: 'Content must be a string' };
  }

  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1500);

    return { success: true };
  } catch (err) {
    return { success: false, error: `Download failed: ${err.message}` };
  }
}

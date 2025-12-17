
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // The result will be in the format: "data:application/pdf;base64,JVBERi0xLjQKJ..."
        // We only need the part after the comma.
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
};

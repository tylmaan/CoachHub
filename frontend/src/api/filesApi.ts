import axiosInstance from "./axiosInstance";

export async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post<{ url: string }>("/files/upload", formData);
    return response.data.url;
}
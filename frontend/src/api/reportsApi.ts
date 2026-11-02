import axiosInstance from "./axiosInstance";
import type { Report, ReportRequest } from "../types/report";

export const getReports = async (): Promise<Report[]> => {
    const response = await axiosInstance.get<Report[]>("/reports");
    return response.data;
}

export async function createReport(request: ReportRequest): Promise<Report> {
    const response = await axiosInstance.post<Report>("/reports", request);
    return response.data;
}

export async function updateReport(id: number, request: ReportRequest): Promise<void> {
    await axiosInstance.put(`/reports/${id}`, request);
}

export async function deleteReport(id: number): Promise<void> {
    await axiosInstance.delete(`/reports/${id}`);
}
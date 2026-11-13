import axiosInstance from "./axiosInstance";
import type { Report, ReportFilters, ReportPage, ReportRequest } from "../types/report";

export const getReports = async (filters: ReportFilters): Promise<ReportPage> => {
    const response = await axiosInstance.get<ReportPage>("/reports", {
        params: {
            days: filters.days,
            kinds: filters.kinds,
            authors: filters.authors,
            unreadOnly: filters.unreadOnly,
            highPriorityOnly: filters.highPriorityOnly,
            search: filters.search.trim() || undefined,
        },
        paramsSerializer: { indexes: null },
    });
    return response.data;
}

export async function getReport(id: number): Promise<Report> {
    const response = await axiosInstance.get<Report>(`/reports/${id}`);
    return response.data;
}

export async function markReportAsRead(id: number): Promise<void> {
    await axiosInstance.post(`/reports/${id}/read`);
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
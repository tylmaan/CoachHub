using CoachHub.Api.Models;
using CoachHub.Api.DTOs;

namespace CoachHub.Api.Services;

public interface IReportService
{
    Task<Report> CreateReportAsync(Report report);
    Task<Report?> GetReportByIdAsync(int id);
    Task<IEnumerable<Report>> GetReportsByPlayerIdAsync(int playerId);
    Task<IEnumerable<Report>> GetReportsByTeamIdAsync(int teamId);
    Task<IEnumerable<Report>> GetReportsByUserIdAsync(string userId);
    Task<List<ReportSummary>> GetSummariesForTeamAsync(int teamId);
    Task<ReportSummary?> GetSummaryByIdAsync(int id);
    Task<bool> UpdateReportAsync(int id,Report report);
    Task<bool> DeleteReportAsync(int id);
}
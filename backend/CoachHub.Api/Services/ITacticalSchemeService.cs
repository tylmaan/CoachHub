using CoachHub.Api.DTOs;
using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface ITacticalSchemeService
{
    Task<List<TacticalSchemeSummary>> GetByMatchIdAsync(int matchId);
    Task<List<TacticalSchemeSummary>> GetByReportIdAsync(int reportId);
    Task<TacticalSchemeSummary?> GetByIdAsync(int id);
    Task<TacticalSchemeSummary> CreateAsync(TacticalScheme tacticalScheme);
    Task<bool> UpdateAsync(int id, TacticalSchemeRequest request);
    Task<bool> DeleteAsync(int id);
}
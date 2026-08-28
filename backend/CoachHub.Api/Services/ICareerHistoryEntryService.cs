using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface ICareerHistoryEntryService
{
    Task<List<CareerHistoryEntry>> GetAllAsync();
    Task<CareerHistoryEntry?> GetByIdAsync(int id);
    Task<CareerHistoryEntry> CreateAsync(CareerHistoryEntry entry);
    Task<bool> UpdateAsync(int id, CareerHistoryEntry entry);
    Task<bool> DeleteAsync(int id);
}
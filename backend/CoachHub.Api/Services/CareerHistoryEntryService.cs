using CoachHub.Api.Models;
using CoachHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class CareerHistoryEntryService : ICareerHistoryEntryService
{
    private readonly ApplicationDbContext _context;

    public CareerHistoryEntryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CareerHistoryEntry>> GetAllAsync()
    {
        return await _context.CareerHistoryEntries.ToListAsync();
    }

    public async Task<CareerHistoryEntry?> GetByIdAsync(int id)
    {
        return await _context.CareerHistoryEntries.FindAsync(id);
    }

    public async Task<CareerHistoryEntry> CreateAsync(CareerHistoryEntry entry)
    {
        _context.CareerHistoryEntries.Add(entry);
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> UpdateAsync(int id, CareerHistoryEntry entry)
    {
        var existing = await _context.CareerHistoryEntries.FindAsync(id);
        if (existing == null)
            return false;

        existing.ClubName = entry.ClubName;
        existing.StartDate = entry.StartDate;
        existing.EndDate = entry.EndDate;
        existing.PlayerId = entry.PlayerId;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entry = await _context.CareerHistoryEntries.FindAsync(id);
        if (entry == null)
            return false;

        _context.CareerHistoryEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }
}
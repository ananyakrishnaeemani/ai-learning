import React from 'react';

const ActivityHeatmap = ({ data }) => {
    // Data is list of { date: "YYYY-MM-DD", count: int }
    // We need to generate a grid of last 365 days (or similar)
    // For simplicity MVP: Last 60 days

    const generateDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 59; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const activity = data.find(item => item.date === dateStr);
            days.push({
                date: dateStr,
                count: activity ? activity.count : 0
            });
        }
        return days;
    };

    const days = generateDays();

    const getColor = (count) => {
        if (count === 0) return 'rgba(255,255,255,0.05)';
        if (count === 1) return 'rgba(139, 92, 246, 0.3)';
        if (count <= 3) return 'rgba(139, 92, 246, 0.6)';
        return 'rgba(139, 92, 246, 0.9)';
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Activity (Last 60 Days)</h3>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                maxWidth: '100%'
            }}>
                {days.map((day) => (
                    <div
                        key={day.date}
                        title={`${day.date}: ${day.count} activities`}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            background: getColor(day.count)
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ActivityHeatmap;

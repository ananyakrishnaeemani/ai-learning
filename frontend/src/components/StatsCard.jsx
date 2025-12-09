import React from 'react';

const StatsCard = ({ title, value, icon, color }) => {
    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: `${color}20`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{value}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{title}</p>
            </div>
        </div>
    );
};

export default StatsCard;

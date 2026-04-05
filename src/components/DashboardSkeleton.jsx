import React from 'react';

const StatSkeleton = () => (
    <div className="glass stat-card skeleton-card">
        <div className="skeleton-block skeleton-icon"></div>
        <div className="skeleton-copy">
            <div className="skeleton-block skeleton-value"></div>
            <div className="skeleton-block skeleton-label"></div>
        </div>
    </div>
);

const SubscriptionSkeleton = () => (
    <div className="glass subscription-skeleton">
        <div className="subscription-skeleton-top">
            <div className="skeleton-block skeleton-service-icon"></div>
            <div className="skeleton-copy">
                <div className="skeleton-block skeleton-service-title"></div>
                <div className="skeleton-block skeleton-service-badge"></div>
            </div>
        </div>
        <div className="skeleton-block skeleton-price"></div>
        <div className="skeleton-block skeleton-meta"></div>
        <div className="skeleton-track">
            <div className="skeleton-block skeleton-progress"></div>
        </div>
        <div className="skeleton-block skeleton-button"></div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="dashboard-wrapper dashboard-skeleton">
            <header className="flex-between dashboard-header">
                <div className="skeleton-copy">
                    <div className="skeleton-block skeleton-hero-title"></div>
                    <div className="skeleton-block skeleton-hero-subtitle"></div>
                </div>
                <div className="header-actions skeleton-actions">
                    <div className="skeleton-block skeleton-select"></div>
                    <div className="skeleton-block skeleton-action"></div>
                    <div className="skeleton-block skeleton-action skeleton-action-primary"></div>
                </div>
            </header>

            <section className="glass bundle-skeleton">
                <div className="skeleton-block skeleton-bundle-title"></div>
                <div className="skeleton-block skeleton-bundle-copy"></div>
                <div className="skeleton-block skeleton-bundle-copy short"></div>
            </section>

            <section className="stats-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                    <StatSkeleton key={index} />
                ))}
            </section>

            <section className="subscriptions-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                    <SubscriptionSkeleton key={index} />
                ))}
            </section>

            <style>{`
                .dashboard-skeleton .skeleton-actions {
                    justify-content: flex-end;
                }
                .bundle-skeleton,
                .skeleton-card,
                .subscription-skeleton {
                    overflow: hidden;
                }
                .bundle-skeleton {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .skeleton-copy {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                }
                .skeleton-block {
                    position: relative;
                    overflow: hidden;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.08);
                }
                .skeleton-block::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    animation: skeletonShimmer 1.5s infinite;
                }
                .skeleton-hero-title {
                    width: min(360px, 72vw);
                    height: 32px;
                    border-radius: 14px;
                }
                .skeleton-hero-subtitle {
                    width: min(280px, 55vw);
                    height: 14px;
                }
                .skeleton-select {
                    width: 220px;
                    height: 42px;
                    border-radius: 12px;
                }
                .skeleton-action {
                    width: 120px;
                    height: 42px;
                    border-radius: 12px;
                }
                .skeleton-action-primary {
                    width: 96px;
                }
                .skeleton-bundle-title {
                    width: 180px;
                    height: 20px;
                    border-radius: 10px;
                }
                .skeleton-bundle-copy {
                    width: 100%;
                    height: 14px;
                }
                .skeleton-bundle-copy.short {
                    width: 68%;
                }
                .skeleton-card {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .skeleton-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    flex-shrink: 0;
                }
                .skeleton-value {
                    width: 120px;
                    height: 24px;
                    border-radius: 12px;
                }
                .skeleton-label {
                    width: 90px;
                    height: 13px;
                }
                .subscription-skeleton {
                    padding: 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .subscription-skeleton-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .skeleton-service-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    flex-shrink: 0;
                }
                .skeleton-service-title {
                    width: 150px;
                    height: 18px;
                    border-radius: 10px;
                }
                .skeleton-service-badge {
                    width: 82px;
                    height: 12px;
                }
                .skeleton-price {
                    width: 132px;
                    height: 34px;
                    border-radius: 14px;
                }
                .skeleton-meta {
                    width: 100%;
                    height: 12px;
                }
                .skeleton-track {
                    width: 100%;
                    height: 6px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.06);
                    overflow: hidden;
                }
                .skeleton-progress {
                    width: 64%;
                    height: 100%;
                    border-radius: inherit;
                }
                .skeleton-button {
                    width: 100%;
                    height: 40px;
                    border-radius: 12px;
                }

                @media (max-width: 768px) {
                    .dashboard-skeleton .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .dashboard-skeleton .skeleton-actions {
                        width: 100%;
                    }
                    .skeleton-select,
                    .skeleton-action,
                    .skeleton-action-primary {
                        flex: 1;
                        width: auto;
                    }
                    .skeleton-hero-title {
                        width: min(260px, 78vw);
                        height: 26px;
                    }
                    .skeleton-hero-subtitle {
                        width: min(220px, 68vw);
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardSkeleton;

package com.tecnoa.apuestas.job;

import com.tecnoa.apuestas.infrastructure.footballdata.SyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SyncJob {

    private static final Logger log = LoggerFactory.getLogger(SyncJob.class);

    private final SyncService syncService;

    public SyncJob(SyncService syncService) {
        this.syncService = syncService;
    }

    // Daily at 3:00 AM — sync competitions and teams
    @Scheduled(cron = "0 0 3 * * *")
    public void syncCompetitionsAndTeams() {
        log.info("Running daily competitions & teams sync");
        syncService.syncCompetitionsAndTeams();
    }

    // Daily at 4:00 AM — sync fixtures
    @Scheduled(cron = "0 0 4 * * *")
    public void syncFixtures() {
        log.info("Running daily fixtures sync");
        syncService.syncFixtures();
    }

    // Every 60 seconds — live results (SyncService internally decides if there are live matches)
    @Scheduled(fixedDelay = 60_000)
    public void syncLiveResults() {
        syncService.syncLiveResults();
    }
}

package com.tecnoa.apuestas.domain.service;

import com.tecnoa.apuestas.api.dto.response.AwardsResponse;
import com.tecnoa.apuestas.api.exception.AppException;
import com.tecnoa.apuestas.api.exception.ErrorCode;
import com.tecnoa.apuestas.domain.model.BettingGroup;
import com.tecnoa.apuestas.domain.model.GroupMember;
import com.tecnoa.apuestas.domain.model.enums.TournamentStatus;
import com.tecnoa.apuestas.domain.repository.BettingGroupRepository;
import com.tecnoa.apuestas.domain.repository.GroupMemberRepository;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AwardsService {

    private final BettingGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;

    public AwardsService(BettingGroupRepository groupRepository, GroupMemberRepository memberRepository) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
    }

    public AwardsResponse getAwards(UUID groupId, UserPrincipal principal) {
        BettingGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND, "Group not found"));

        if (!memberRepository.existsByGroupIdAndUserId(groupId, principal.getUserId())) {
            throw new AppException(ErrorCode.NOT_GROUP_MEMBER, "Not a member");
        }

        boolean finished = group.getTournament().getStatus() == TournamentStatus.FINISHED;
        List<GroupMember> members = memberRepository.findByGroupIdOrderByTotalPointsDesc(groupId);

        long count = members.size();
        BigDecimal entryFee = group.getEntryFee() != null ? group.getEntryFee() : BigDecimal.ZERO;
        BigDecimal totalPool = entryFee.multiply(BigDecimal.valueOf(count));
        BigDecimal commission = totalPool.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);

        int[] percentages = {55, 25, 15};
        List<AwardsResponse.PrizeEntry> prizes = new ArrayList<>();
        for (int i = 0; i < Math.min(3, members.size()); i++) {
            GroupMember m = members.get(i);
            BigDecimal amount = totalPool.multiply(BigDecimal.valueOf(percentages[i]))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            prizes.add(new AwardsResponse.PrizeEntry(
                    i + 1, m.getUser().getId(), m.getUser().getName(),
                    m.getTotalPoints(), percentages[i], amount
            ));
        }

        return new AwardsResponse(groupId, finished, totalPool, prizes,
                new AwardsResponse.CommissionEntry(5, commission));
    }
}

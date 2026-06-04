package com.tecnoa.apuestas.api.controller;

import com.tecnoa.apuestas.api.dto.request.CreateGroupRequest;
import com.tecnoa.apuestas.api.dto.request.JoinGroupRequest;
import com.tecnoa.apuestas.api.dto.response.GroupResponse;
import com.tecnoa.apuestas.api.dto.response.LeaderboardResponse;
import com.tecnoa.apuestas.domain.service.GroupService;
import com.tecnoa.apuestas.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/groups")
@Tag(name = "Betting Groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                @Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.status(201).body(groupService.createGroup(principal, request));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(groupService.getMyGroups(principal));
    }

    @GetMapping("/explore")
    public ResponseEntity<List<GroupResponse>> getExploreGroups() {
        return ResponseEntity.ok(groupService.getPublicGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getGroup(@PathVariable UUID id,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(groupService.getGroup(id, principal));
    }

    @PostMapping("/join")
    public ResponseEntity<GroupResponse> join(@AuthenticationPrincipal UserPrincipal principal,
                                              @Valid @RequestBody JoinGroupRequest request) {
        return ResponseEntity.ok(groupService.joinGroup(principal, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        groupService.deleteGroup(id, principal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<LeaderboardResponse> getLeaderboard(@PathVariable UUID id,
                                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(groupService.getLeaderboard(id, principal));
    }

    @GetMapping("/{id}/invite")
    public ResponseEntity<Map<String, String>> getInvite(@PathVariable UUID id,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(groupService.getInviteLink(id, principal));
    }
}

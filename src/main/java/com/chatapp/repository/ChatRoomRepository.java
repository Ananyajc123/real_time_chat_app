package com.chatapp.repository;
import com.chatapp.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    @Query("SELECT r FROM ChatRoom r JOIN r.members m WHERE m.id = :userId ORDER BY r.createdAt DESC")
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);
    @Query("SELECT r FROM ChatRoom r WHERE r.type = 'DIRECT' AND EXISTS (SELECT 1 FROM r.members m1 WHERE m1.id = :uid1) AND EXISTS (SELECT 1 FROM r.members m2 WHERE m2.id = :uid2) AND SIZE(r.members) = 2")
    Optional<ChatRoom> findDirectRoom(@Param("uid1") Long uid1, @Param("uid2") Long uid2);
}

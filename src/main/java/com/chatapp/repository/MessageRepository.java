package com.chatapp.repository;
import com.chatapp.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE m.room.id = :roomId ORDER BY m.sentAt DESC")
    List<Message> findLatestByRoomId(@Param("roomId") Long roomId, Pageable pageable);
    @Query("SELECT COUNT(m) FROM Message m WHERE m.room.id = :roomId AND m.sender.id != :userId AND m.readStatus != 'READ'")
    Long countUnread(@Param("roomId") Long roomId, @Param("userId") Long userId);
    @Modifying
    @Query("UPDATE Message m SET m.readStatus = 'READ' WHERE m.room.id = :roomId AND m.sender.id != :userId AND m.readStatus != 'READ'")
    void markAsRead(@Param("roomId") Long roomId, @Param("userId") Long userId);
    @Query("SELECT m FROM Message m WHERE m.room.id = :roomId AND LOWER(m.content) LIKE %:query% ORDER BY m.sentAt DESC")
    List<Message> searchInRoom(@Param("roomId") Long roomId, @Param("query") String query);
}

package com.chatapp.config;

import com.chatapp.model.*;
import com.chatapp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired private UserRepository userRepository;
    @Autowired private ChatRoomRepository chatRoomRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;
        log.info("Seeding demo data...");

        String[] colors = {"#4f46e5","#10b981","#f59e0b","#ef4444","#6366f1"};
        String[] names = {"alice","bob","charlie","diana","eve"};

        List<User> users = new ArrayList<>();
        for (int i = 0; i < names.length; i++) {
            User u = new User();
            u.setUsername(names[i]);
            u.setEmail(names[i] + "@demo.com");
            u.setPassword(passwordEncoder.encode("demo123"));
            u.setAvatarColor(colors[i]);
            u.setStatus(User.OnlineStatus.OFFLINE);
            users.add(userRepository.save(u));
        }

        ChatRoom group = new ChatRoom();
        group.setName("General 💬");
        group.setType(ChatRoom.RoomType.GROUP);
        group.setMembers(users);
        chatRoomRepository.save(group);

        ChatRoom dm = new ChatRoom();
        dm.setType(ChatRoom.RoomType.DIRECT);
        dm.setMembers(List.of(users.get(0), users.get(1)));
        chatRoomRepository.save(dm);

        log.info("Demo data seeded. Login: alice@demo.com / demo123");
    }
}

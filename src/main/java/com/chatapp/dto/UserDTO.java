package com.chatapp.dto;
public class UserDTO {
    public Long id; public String username, email, avatarColor, status, bio;
    public UserDTO() {}
    public static UserDTOBuilder builder() { return new UserDTOBuilder(); }
    public static class UserDTOBuilder {
        private Long id; private String username, email, avatarColor, status, bio;
        public UserDTOBuilder id(Long v) { this.id=v; return this; }
        public UserDTOBuilder username(String v) { this.username=v; return this; }
        public UserDTOBuilder email(String v) { this.email=v; return this; }
        public UserDTOBuilder avatarColor(String v) { this.avatarColor=v; return this; }
        public UserDTOBuilder status(String v) { this.status=v; return this; }
        public UserDTOBuilder bio(String v) { this.bio=v; return this; }
        public UserDTO build() { UserDTO u=new UserDTO(); u.id=id; u.username=username; u.email=email; u.avatarColor=avatarColor; u.status=status; u.bio=bio; return u; }
    }
}

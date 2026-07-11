package com.acueducto.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "videos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(length = 300)
    private String descripcion;

    @Column(name = "url_video", nullable = false, length = 300)
    private String urlVideo;

    @Builder.Default
    @Column(nullable = false)
    private boolean visible = true;
}

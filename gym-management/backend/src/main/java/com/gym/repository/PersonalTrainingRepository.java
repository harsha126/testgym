package com.gym.repository;

import com.gym.entity.PersonalTraining;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalTrainingRepository extends JpaRepository<PersonalTraining, Long> {

    /**
     * Find personal training enrollment by user ID
     */
    Optional<PersonalTraining> findByUserId(Long userId);

    /**
     * Find all active personal training enrollments
     */
    List<PersonalTraining> findByIsActiveTrue();

    /**
     * Find all active enrollments with users eagerly loaded
     */
    @Query("SELECT pt FROM PersonalTraining pt JOIN FETCH pt.user WHERE pt.isActive = true")
    List<PersonalTraining> findAllActiveWithUsers();

    /**
     * Check if a user is already enrolled in personal training
     */
    boolean existsByUserId(Long userId);

    /**
     * Find all personal training enrollments (active and inactive)
     */
    @Query("SELECT pt FROM PersonalTraining pt JOIN FETCH pt.user ORDER BY pt.createdAt DESC")
    List<PersonalTraining> findAllWithUsers();
}

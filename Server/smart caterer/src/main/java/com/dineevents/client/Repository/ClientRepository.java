package com.dineevents.client.Repository;

import com.dineevents.client.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findByClientEmailIgnoreCase(String clientEmail);

    Optional<Client> findFirstByClientEmailIgnoreCase(String clientEmail);
}

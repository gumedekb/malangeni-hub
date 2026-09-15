# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
# A Maven base image rather than `./mvnw`: this repo has an empty .mvn/ and no
# wrapper script, so a wrapper-based build would fail inside the container.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy the POM on its own first. Docker caches this layer, so a source-only
# change rebuilds in seconds instead of re-downloading every dependency from
# Maven Central. Copying src/ before this would defeat the cache on every edit.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Tests are skipped here deliberately: the image build is not the place to
# discover a failing test, and there is no meaningful suite yet (see Phase 9.8).
# Run tests in CI or locally, not on the deploy path.
RUN mvn -B -q clean package -DskipTests

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
# JRE, not JDK: nothing at runtime needs a compiler, and the smaller image
# means faster cold starts on Cloud Run.
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Never run the application as root.
RUN groupadd --system spring && useradd --system --gid spring spring

COPY --from=build /build/target/*.jar app.jar
RUN chown spring:spring app.jar
USER spring

# Documentation only - it publishes nothing by itself. Render and Cloud Run inject PORT
# and the app reads it via server.port=${PORT:8080}.
EXPOSE 8080

# JVM flags, overridable per host (render.yaml sets a smaller heap for a 512 MB plan).
# -XX:MaxRAMPercentage - the JVM's default heap sizing misreads a memory-capped
#   container and the process gets OOM-killed under load.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

# `exec` replaces the shell, so the JVM runs as PID 1 and receives the host's SIGTERM,
# giving Spring a clean shutdown instead of a hard kill.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

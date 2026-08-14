FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

COPY backend/Commons.sln backend/
COPY backend/Commons.Api/Commons.Api.csproj backend/Commons.Api/
COPY backend/Commons.Domain/Commons.Domain.csproj backend/Commons.Domain/
COPY backend/Commons.Domain.Tests/Commons.Domain.Tests.csproj backend/Commons.Domain.Tests/
COPY backend/Commons.Infrastructure/Commons.Infrastructure.csproj backend/Commons.Infrastructure/
COPY backend/Commons.Infrastructure.Tests/Commons.Infrastructure.Tests.csproj backend/Commons.Infrastructure.Tests/
COPY backend/Commons.Api.Tests/Commons.Api.Tests.csproj backend/Commons.Api.Tests/
RUN dotnet restore backend/Commons.sln

FROM restore AS development
COPY backend/ backend/
WORKDIR /src/backend
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV DOTNET_WATCH_RESTART_ON_RUDE_EDIT=1
EXPOSE 8080
CMD ["dotnet", "watch", "--project", "Commons.Api/Commons.Api.csproj", "run", "--no-launch-profile", "--urls", "http://0.0.0.0:8080"]

FROM restore AS build
COPY backend/ backend/
RUN dotnet publish backend/Commons.Api/Commons.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Commons.Api.dll"]

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/Commons.sln backend/
COPY backend/Commons.Api/Commons.Api.csproj backend/Commons.Api/
COPY backend/Commons.Domain/Commons.Domain.csproj backend/Commons.Domain/
COPY backend/Commons.Domain.Tests/Commons.Domain.Tests.csproj backend/Commons.Domain.Tests/
COPY backend/Commons.Infrastructure/Commons.Infrastructure.csproj backend/Commons.Infrastructure/
COPY backend/Commons.Infrastructure.Tests/Commons.Infrastructure.Tests.csproj backend/Commons.Infrastructure.Tests/
COPY backend/Commons.Api.Tests/Commons.Api.Tests.csproj backend/Commons.Api.Tests/
RUN dotnet restore backend/Commons.sln

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

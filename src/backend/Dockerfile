# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY QuiteUp.slnx .
COPY QuiteUp.Domain/QuiteUp.Domain.csproj QuiteUp.Domain/
COPY QuiteUp.Application/QuiteUp.Application.csproj QuiteUp.Application/
COPY QuiteUp.Infrastructure/QuiteUp.Infrastructure.csproj QuiteUp.Infrastructure/
COPY QuiteUp.Api/QuiteUp.Api.csproj QuiteUp.Api/

RUN dotnet restore

COPY . .
RUN dotnet publish QuiteUp.Api -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "QuiteUp.Api.dll"]

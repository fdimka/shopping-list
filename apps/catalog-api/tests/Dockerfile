FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /src
COPY . .
CMD ["dotnet", "test", "tests/Catalog.Api.Tests.csproj", "-c", "Release"]

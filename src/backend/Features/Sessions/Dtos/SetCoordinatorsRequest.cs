using EnableFront.Builder.Features.People;

namespace EnableFront.Builder.Features.Sessions.Dtos;

public record SetCoordinatorsRequest(List<PersonInput> People);

using EnableFront.Builder.Features.People;

namespace EnableFront.Builder.Features.Sessions.Dtos;

public record SetPresentersRequest(List<PersonInput> People);

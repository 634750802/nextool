export interface ClientFetchErrorParser<Data, Error> {
  test: (json: any) => boolean;
  toLocalError: (json: Data) => Error;
}

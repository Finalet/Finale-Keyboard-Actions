import Ajv, { ValidateFunction } from "ajv/dist/2020";
import { IO } from "./misc";

export default class JSONValidator {
  private static ajv = new Ajv({ strict: true, allErrors: true });

  private readonly validator: ValidateFunction<unknown>;

  constructor(schemaPath: string) {
    this.validator = JSONValidator.ajv.compile(IO.loadJsonFile(schemaPath));
  }

  Validate(data: unknown, context: string = "JSON"): void {
    if (!this.validator(data)) {
      throw new Error(`${context} failed validation: ${JSONValidator.ajv.errorsText(this.validator.errors)}`);
    }
  }
}

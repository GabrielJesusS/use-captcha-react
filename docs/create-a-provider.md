# Create a Provider

## What is a Provider?

A provider is a class abstraction for a captcha service. It implements the service’s functionalities as class methods, simplifying the process of using captcha functions.

The `use-captcha-react` library leverages these abstractions along with polymorphism to create a compact and modular way to integrate captcha services and easily swap between them if necessary.

## Provider Class

The `Provider` is a class that defines the captcha service to be used. It includes the following properties and methods:

| Property/Method | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `name`          | The name of the provider.                                                  |
| `src`           | The URL of the captcha script to be loaded.                                |
| `options?`      | Optional configuration options for the captcha (varies by provider).       |
| `execute`       | Executes the captcha process.                                              |
| `reset`         | Resets the captcha.                                                        |
| `executeAsync`  | Executes the captcha asynchronously, returning a `Promise` with the captcha token or `null`. |
| `getWidget`     | Retrieves the widget identifier, if applicable.                            |
| `getValue`      | Retrieves the current captcha value.                                       |
| `initialize`    | Initializes the captcha with the given DOM element.                        |

Except for `options`, all other methods are required. These properties and methods enable a highly flexible implementation, supporting both predefined and custom captcha integrations.

## Creating a Provider

To create a provider class, implement the base `CaptchaProvider` class:

```typescript
export class SampleProvider implements CaptchaProvider<Options> {
    // Define the required methods and properties
}
```

The generic `Options` type is required. You can initialize it with `undefined` if no options are needed. Using the `options` object, you can pass callbacks, captcha settings, and other configuration values to the class.

When you pass the Provider to the `useCaptcha` hook, the hook automatically injects the script using the `src` value defined in the class and executes the `initialize` method. The `initialize` method can be customized to perform any required routine before the captcha is instantiated.


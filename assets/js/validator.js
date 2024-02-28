const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function Validator(options) {
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  function removeInvalidState(inputElement) {
    const parentElement = getParent(inputElement, options.formGroupSelector);
    const errorElement = parentElement.querySelector(options.errorSelector);

    parentElement.classList.remove("invalid");
    errorElement.innerText = "";
  }

  let selectorRules = {};

  function validateControl(inputElement, rule) {
    const parentElement = getParent(inputElement, options.formGroupSelector);
    const errorElement = parentElement.querySelector(options.errorSelector);
    let isError;

    // Get rules of selector
    let rules = selectorRules[rule.selector];

    // Loop through each rule and stop if error
    for (let index = 0; index < rules.length; index++) {
      switch (inputElement.type) {
        case "radio":
        case "checkbox":
          isError = rules[index](
            formElement.querySelector(rule.selector + ":checked")
          );
          break;

        default:
          isError = rules[index](inputElement.value);
      }
      if (isError) {
        break;
      }
    }

    if (isError) {
      errorElement.innerText = isError;
      parentElement.classList.add("invalid");
    } else {
      removeInvalidState(inputElement);
    }

    // Convert to boolean type
    return !!isError;
  }

  const formElement = $(options.form);
  if (formElement) {
    formElement.addEventListener("submit", e => {
      e.preventDefault();

      let isFormValid = true;

      // Loop through each rule and validate
      options.rules.forEach(rule => {
        let inputElement = formElement.querySelector(rule.selector);
        let isValid = !validateControl(inputElement, rule);
        if (!isValid) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        if (typeof options.onSubmit === "function") {
          const enableInputs = formElement.querySelectorAll("[name]:not([disabled])");
          const formValues = Array.from(enableInputs).reduce((values, input) => {
            switch (input.type) {
              case "radio":
                values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`).value;
                break;
              case "checkbox":
                if (!input.matches(":checked")) {
                  values[input.name] = [];
                  return values;
                }
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);
                break;
              case "file":
                values[input.name] = input.files;
                break;
              default:
                values[input.name] = input.value;
            }
            return values;
          }, {});

          // Submit with JavaScript
          options.onSubmit(formValues);
        } else {
          // Submit with default behavior
          formElement.submit();
        }
      }
    });

    // Loop through each rule and listen to event like blur, input, ...
    options.rules.forEach(rule => {
      // Saving rules for each input
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.validate);
      } else {
        selectorRules[rule.selector] = [rule.validate];
      }

      const inputElements = formElement.querySelectorAll(rule.selector);

      if (inputElements) {
        Array.from(inputElements).forEach(inputElement => {
          inputElement.addEventListener("blur", () => {
            validateControl(inputElement, rule);
          });

          inputElement.addEventListener("input", () => {
            removeInvalidState(inputElement);
          });
        });
      }
    });
  }
}

Validator.isRequired = (
  selector,
  message = "Giá trị nhập không chính xác!"
) => ({
  selector: selector,
  validate: value => {
    if (typeof value == "string") {
      value = value.trim();
    }

    return !value
      ? message
      : undefined;
  }
})

Validator.isEmail = (
  selector,
  message = "Giá trị nhập không chính xác!"
) => ({
  selector: selector,
  validate: value => {
    return !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))
      ? message
      : undefined;
  }
})

Validator.isMinLength = (
  selector,
  min = 6,
  message = "Giá trị nhập không chính xác!"
) => ({
  selector: selector,
  validate: value => {
    return !(value.trim().length >= min)
      ? `${message} (${min})`
      : undefined;
  }
})

Validator.isConfirmed = (
  selector,
  getConfirmValue,
  message = "Giá trị nhập không chính xác!"
) => ({
  selector: selector,
  validate: value => {
    return !(value === getConfirmValue())
      ? message
      : undefined;
  }
})

Validator({
  form: "#form-1",
  formGroupSelector: ".form-group",
  errorSelector: ".form-message",
  rules: [
    Validator.isRequired(
      "#fullname",
      "Vui lòng nhập Họ và Tên!"
    ),

    Validator.isEmail(
      "#email",
      "Trường này phải là email!"
    ),

    Validator.isMinLength(
      "#password",
      8,
      "Vui lòng nhập đủ số kí tự tối thiểu"
    ),

    Validator.isConfirmed(
      "#password_confirmation",
      () => $("#form-1 #password").value,
      "Mật khẩu nhập lại không chính xác!"
    ),

    Validator.isRequired(
      'input[name="gender"]',
      "Vui lòng chọn giới tính!"
    ),

    Validator.isRequired(
      "#province",
      "Vui lòng chọn nơi cư trú!"
    )
  ],
  onSubmit: data => console.log(data)
});
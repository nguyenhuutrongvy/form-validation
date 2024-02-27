const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function Validator(options) {
  function removeInvalidState(inputElement) {
    const parentElement = inputElement.parentElement;
    const errorElement = parentElement.querySelector(options.errorSelector);

    parentElement.classList.remove("invalid");
    errorElement.innerText = "";
  }

  let selectorRules = {};

  function validateControl(inputElement, rule) {
    const parentElement = inputElement.parentElement;
    const errorElement = parentElement.querySelector(options.errorSelector);
    let isError;

    // Get rules of selector
    let rules = selectorRules[rule.selector];

    // Loop through each rule and stop if error
    for (let index = 0; index < rules.length; index++) {
      isError = rules[index](inputElement.value);
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
            return (values[input.name] = input.value) && values;
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

      const inputElement = formElement.querySelector(rule.selector);

      if (inputElement) {
        inputElement.addEventListener("blur", () => {
          validateControl(inputElement, rule);
        });

        inputElement.addEventListener("input", () => {
          removeInvalidState(inputElement);
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
    return !(value.trim())
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
  selector, getConfirmValue,
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
  errorSelector: ".form-message",
  rules: [
    Validator.isRequired(
      "#fullname",
      "Vui lòng nhập đúng họ và tên!"
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
    )
  ],
  onSubmit: data => console.log(data)
});
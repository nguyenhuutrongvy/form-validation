const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function Validator(formSelector, options = {}) {
  function getParent(element, selector) {
    while (element.parentElement) {
      let parentElement = element.parentElement;
      if (parentElement.matches(selector)) {
        return parentElement;
      }
      element = parentElement;
    }
  }

  let formRules = {};
  const defaultMessage = "Vui lòng nhập trường này!";
  let validatorRules = {
    required: (value, message = defaultMessage) => {
      return value.trim()
        ? undefined
        : message;
    },
    email: (value) => {
      return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))
        ? undefined
        : "Trường này phải là email!";
    },
    min: min => {
      return (value) => {
        return value.length >= min
          ? undefined
          : `Vui lòng nhập tối thiểu ${min} ký tự!`;
      }
    }
  };

  const formElement = $(formSelector);
  if (formElement) {
    const inputs = formElement.querySelectorAll("[name][rules]");
    if (inputs) {
      inputs.forEach(input => {
        let rules = input.getAttribute("rules").split("|");
        if (rules) {
          rules.forEach(rule => {
            let ruleInfo;
            const isRuleHasValue = rule.includes(':');

            if (isRuleHasValue) {
              ruleInfo = rule.split(':');
              rule = ruleInfo[0];
            }

            let ruleFunc = validatorRules[rule];

            if (isRuleHasValue) {
              ruleFunc = ruleFunc(ruleInfo[1]);
            }

            if (Array.isArray(formRules[input.name])) {
              formRules[input.name].push(ruleFunc);
            } else {
              formRules[input.name] = [ruleFunc];
            }
          });
        }

        input.addEventListener("blur", handleValidate);
        input.addEventListener("input", e => {
          const formGroup = getParent(e.target, ".form-group");
          let formMessage;
          if (formGroup) {
            formGroup.classList.remove("invalid");
            formMessage = formGroup.querySelector(".form-message");
            if (formMessage) {
              formMessage.innerText = "";
            }
          }
        });
      });

      // Validate function
      function handleValidate(event) {
        let rules = formRules[event.target.name];
        let errorMessage;

        rules.some(rule => {
          errorMessage = rule(event.target.value);
          return errorMessage;
        });

        const formGroup = getParent(event.target, ".form-group");
        let formMessage;
        if (formGroup) {
          formMessage = formGroup.querySelector(".form-message");
        }

        // Show error message if error
        if (errorMessage) {
          if (formGroup) {
            formGroup.classList.add("invalid");
          }
          if (formMessage) {
            formMessage.innerText = errorMessage;
          }
        } else {
          if (formGroup) {
            formGroup.classList.remove("invalid");
          }
          if (formMessage) {
            formMessage.innerText = "";
          }
        }
        return !errorMessage;
      }
    }

    formElement.addEventListener("submit", e => {
      e.preventDefault();
      let isValid = true;
      inputs.forEach(input => {
        if (!handleValidate({ target: input })) {
          isValid = false;
        }
      });

      if (isValid) {
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
  }
}
Ниже приведены различные сценарии использования универсального компонента `SmartModalComponent`, в котором есть поля разных типов (text, textarea, select, number, date, checkbox) и поддерживается валидация через **Template-Driven Forms** (используя `ngForm`, `[(ngModel)]`, атрибуты `required`, `min`, `max` и т.д.). Предполагается, что в **`edit-modal.component.*`** (ts/html/scss) уже реализован код наподобие того, который мы показали ранее.

> **Внимание:** В файлах `smart-modal.component.ts/html/scss` **нет изменений** по сравнению с предыдущими версиями. Ниже приведён только код вызова и использования модалки из родительских (или других) компонентов.

---

## 1. **Одно текстовое поле** (минимальный пример)

```ts
// parent-single-text.component.ts
import { Component, ViewChild } from '@angular/core';
import { SmartModalComponent, EditModalField } from '../smart-modal/smart-modal.component';

@Component({
  selector: 'app-parent-single-text',
  template: `
    <button (click)="openModal()">Редактировать</button>
    
    <app-edit-modal
      #editModalRef
      [title]="modalTitle"
      [fields]="modalFields"
      [initialData]="modalData"
      (modalResult)="onModalResult($event)"
    ></app-edit-modal>
  `
})
export class ParentSingleTextComponent {
  @ViewChild('editModalRef') editModalRef!: SmartModalComponent;

  modalTitle = 'Редактирование имени';
  modalFields: EditModalField[] = [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
      placeholder: 'Введите ваше имя'
    }
  ];
  modalData = {
    name: 'Иван' // начальное значение
  };

  openModal(): void {
    this.editModalRef.openModal();
  }

  onModalResult(editedData: any): void {
    console.log('Новые данные:', editedData);
    // Далее можно сохранить изменения, отправить на сервер и т.п.
  }
}
```

- Здесь всего одно поле: `type: 'text'`.
- Без обязательности и дополнительных валидаторов: `[required]="false"` по умолчанию.

---

## 2. **Несколько полей (text + date + number) с валидацией**

```ts
// parent-multi-fields.component.ts
import { Component, ViewChild } from '@angular/core';
import { SmartModalComponent, EditModalField } from '../smart-modal/smart-modal.component';

@Component({
  selector: 'app-parent-multi-fields',
  template: `
    <button (click)="openModal()">Редактировать</button>
    
    <app-edit-modal
      #editModalRef
      [title]="modalTitle"
      [fields]="modalFields"
      [initialData]="modalData"
      (modalResult)="onModalResult($event)"
    ></app-edit-modal>
  `
})
export class ParentMultiFieldsComponent {
  @ViewChild('editModalRef') editModalRef!: SmartModalComponent;

  modalTitle = 'Форма с несколькими полями';
  modalFields: EditModalField[] = [
    {
      name: 'title',
      label: 'Заголовок',
      type: 'text',
      required: true,           // поле обязательно
      minLength: 3,            // минимум 3 символа
      maxLength: 50,           // максимум 50 символов
      placeholder: 'Введите заголовок...'
    },
    {
      name: 'startDate',
      label: 'Дата начала',
      type: 'date',
      required: true            // поле обязательно
    },
    {
      name: 'count',
      label: 'Количество',
      type: 'number',
      required: true,           // поле обязательно
      min: 1,
      max: 100
    }
  ];
  modalData = {
    title: '',
    startDate: '',
    count: 10
  };

  openModal(): void {
    this.editModalRef.openModal();
  }

  onModalResult(editedData: any): void {
    console.log('Результат редактирования:', editedData);
    // Например, можем отправить на сервер
  }
}
```

- `title` — обязателен, 3…50 символов.
- `startDate` — обязательно для заполнения.
- `count` — обязателен, допустимые значения от 1 до 100.
- Пока данные невалидны, кнопка «OK» будет заблокирована (если вы подключили `[disabled]="editForm.invalid"`).

---

## 3. **Select (список) и Checkbox**

```ts
// parent-select-checkbox.component.ts
import { Component, ViewChild } from '@angular/core';
import { SmartModalComponent, EditModalField } from '../smart-modal/smart-modal.component';

@Component({
  selector: 'app-parent-select-checkbox',
  template: `
    <button (click)="openModal()">Настройки пользователя</button>

    <app-edit-modal
      #editModalRef
      [title]="modalTitle"
      [fields]="modalFields"
      [initialData]="modalData"
      (modalResult)="onModalResult($event)"
    ></app-edit-modal>
  `
})
export class ParentSelectCheckboxComponent {
  @ViewChild('editModalRef') editModalRef!: SmartModalComponent;

  modalTitle = 'Настройки пользователя';

  modalFields: EditModalField[] = [
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      required: true,
      options: ['Администратор', 'Менеджер', 'Пользователь']
    },
    {
      name: 'isActive',
      label: 'Активен',
      type: 'checkbox'
    }
  ];

  modalData = {
    role: 'Пользователь',
    isActive: false
  };

  openModal(): void {
    this.editModalRef.openModal();
  }

  onModalResult(editedData: any): void {
    console.log('Выбранная роль:', editedData.role);
    console.log('Активен ли:', editedData.isActive);
  }
}
```

- Селект (select) заставляем быть обязательным (`required: true`), в массиве `options` три значения.
- Чекбокс `isActive` может быть необязательным, потому что `required` не выставлен (или `false` по умолчанию).

---

## 4. **TextArea, Pattern (регулярное выражение) и Checkbox**

```ts
// parent-advanced-validation.component.ts
import { Component, ViewChild } from '@angular/core';
import { SmartModalComponent, EditModalField } from '../smart-modal/smart-modal.component';

@Component({
  selector: 'app-parent-advanced-validation',
  template: `
    <button (click)="openModal()">Открыть форму</button>

    <app-edit-modal
      #editModalRef
      [title]="modalTitle"
      [fields]="modalFields"
      [initialData]="modalData"
      (modalResult)="onModalResult($event)"
    ></app-edit-modal>
  `
})
export class ParentAdvancedValidationComponent {
  @ViewChild('editModalRef') editModalRef!: SmartModalComponent;

  modalTitle = 'Продвинутая валидация';

  modalFields: EditModalField[] = [
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      required: true,
      minLength: 5,
      maxLength: 200,
      placeholder: 'Опишите задачу...'
    },
    {
      name: 'email',
      label: 'E-mail',
      type: 'text',
      required: true,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', // простая регулярка
      placeholder: 'user@example.com'
    },
    {
      name: 'acceptRules',
      label: 'Принимаю правила',
      type: 'checkbox',
      required: true
    }
  ];

  modalData = {
    description: '',
    email: '',
    acceptRules: false
  };

  openModal(): void {
    this.editModalRef.openModal();
  }

  onModalResult(editedValues: any): void {
    console.log('Описание:', editedValues.description);
    console.log('E-mail:', editedValues.email);
    console.log('Принял правила?', editedValues.acceptRules);
  }
}
```

- Поле `description` — обязательное, 5…200 символов.
- Поле `email` — обязательное, должно соответствовать регулярке (здесь простейшая проверка на `@` и `.`).
- Checkbox `acceptRules` — тоже обязательный, пока не поставлен, форма будет невалидна.

---

## 5. **Смешанная форма (все основные типы вместе)**

```ts
// parent-all-types.component.ts
import { Component, ViewChild } from '@angular/core';
import { SmartModalComponent, EditModalField } from '../smart-modal/smart-modal.component';

@Component({
  selector: 'app-parent-all-types',
  template: `
    <button (click)="openModal()">Редактировать всё</button>

    <app-edit-modal
      #editModalRef
      [title]="modalTitle"
      [fields]="modalFields"
      [initialData]="modalData"
      (modalResult)="onModalResult($event)"
    ></app-edit-modal>
  `
})
export class ParentAllTypesComponent {
  @ViewChild('editModalRef') editModalRef!: SmartModalComponent;

  modalTitle = 'Форма со всеми типами';

  modalFields: EditModalField[] = [
    {
      name: 'username',
      label: 'Имя пользователя',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 15
    },
    {
      name: 'notes',
      label: 'Заметки',
      type: 'textarea',
      placeholder: 'Дополнительная информация'
    },
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      required: true,
      options: ['Admin', 'Editor', 'Guest']
    },
    {
      name: 'limit',
      label: 'Лимит',
      type: 'number',
      min: 0,
      max: 999
    },
    {
      name: 'deadline',
      label: 'Дата дедлайна',
      type: 'date'
    },
    {
      name: 'active',
      label: 'Активен',
      type: 'checkbox'
    }
  ];

  // Начальные данные
  modalData = {
    username: 'Boss',
    notes: '',
    role: 'Guest',
    limit: 10,
    deadline: '2025-01-01',
    active: false
  };

  openModal(): void {
    this.editModalRef.openModal();
  }

  onModalResult(editedValues: any): void {
    console.log('Формовые данные:', editedValues);
  }
}
```

- Сразу несколько полей разных типов.
- Некоторые — обязательные (username, role), некоторые — нет.
- Есть всё: text, textarea, select, number, date, checkbox.

---

### Итоги

1. Во всех примерах используется **один и тот же** универсальный `SmartModalComponent`.
2. В родительском компоненте (или любом месте, откуда нужно вызвать диалог) передаётся массив `fields` и объект `initialData`.
3. При закрытии по «OK» вы получаете итоговые данные через `(modalResult)`.
4. При **Template-Driven Forms** и наличии `[disabled]="editForm.invalid"` на кнопке «OK» форма не даст подтвердить, пока не пройдена базовая валидация (required, min/max, pattern и т.д.).

Во всех вышеуказанных сценариях мы **не меняли** файлы `smart-modal.component.ts/html/scss`, а только показывали **примеры родительских компонентов**.

> **Нет изменений** в файлах `edit-modal.component.*`.

Таким образом, вы можете адаптировать эти сценарии под любые нужды, добавляя/убирая поля, типы валидации и начальные данные.
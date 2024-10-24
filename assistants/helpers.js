const delayer = (time) => new Promise((resolve) => setTimeout(resolve, time));

const getTime = async () => {
    const time = new Date();

    const optionsTime = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };

    return new Intl.DateTimeFormat('en-US', optionsTime).format(time);
};

const dropdownSearch = async (page, toggleElement, searchedText) => {
    await toggleElement.click();
    await page.waitForSelector('div[data-test="menu-container"]', { timeout: 10000 });
    const dropdownMenu = await page.$('div[data-test="menu-container"]');
    if (dropdownMenu) {
        // console.log("Dropdown menu founded");
        await page.waitForSelector('span[data-ev-label="menu_item"]', { timeout: 10000 });
        const dropdownMenuItems = await dropdownMenu.$$('span[data-ev-label="menu_item"]');
        for (let dropdownMenuItem of dropdownMenuItems) {
            const dropdownMenuItemText = await dropdownMenuItem.evaluate(el => el.textContent.trim());
            // console.log("Dropdown menu item text:", dropdownMenuItemText);
            if (dropdownMenuItemText.includes(searchedText)) {
                // console.log("Item founded");
                await dropdownMenuItem.click();
                break;
            }
        }
        await delayer(1000);
    }
}

const getElementValue = async (parentElement, mainElementSelector, childElementSelector, getNumber, regex) => {
    try {
        let mainElement = await parentElement.$(mainElementSelector);
        if (!mainElement) {
            console.error(`Element with selector "${mainElementSelector}" not found`);
            return null;
        } else {
            if (childElementSelector) {
                const childElement = await mainElement.$(childElementSelector);
                if (childElement) {
                    mainElement = childElement;
                } else {
                    console.error(`Child element "${childElementSelector}" in "${mainElementSelector}" not found`);
                    return null;
                }
            }
            const elementText = await mainElement.evaluate(el => el.textContent.trim());
            if (!elementText) {
                console.error(`No text found in "${mainElementSelector}"`);
                return null;
            }
            if (!getNumber) {
                // console.log(elementText);
                return elementText;
            }
            const elementMatch = regex ? elementText.match(regex) : elementText;
            if (!elementMatch) {
                console.error(`No match found for text "${elementText}" with regex "${regex}"`);
                return null;
            }
            const elementString = Array.isArray(elementMatch) ? elementMatch[1] : elementMatch;
            const sanitizedString = elementString.replace(/,/g, '');

            const elementNumber = Number(sanitizedString);
            if (isNaN(elementNumber)) {
                console.error(`Failed to convert "${sanitizedString}" to a number`);
                return null;
            }
            // console.log(elementNumber);
            return elementNumber;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
};

const smoothMouseMoveAndClick = async (page, element, steps) => {
    await page.evaluate((el) => {
        //Скрол сторінки
        el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });
    }, element);
    await delayer(1000);

    const box = await element.boundingBox(); // Обраховуємо координати блока, щоб передвигати до нього курсор
    if (!box) {
        console.log("Unable to retrieve bounding box");
        return;
    }

    let startY;
    let startX;
    let endX = box.x + box.width / 2; // Знаходим центр координат блока
    let endY = box.y + box.height / 2;

    if (!startY || !startX) {
        // Якщо ще не оголошували початкові координати (звідки буде рухатись курсор), то задаєм статичне значення
        startY = 400;
        startX = 400;
    }

    // Просто прийми це. Ця функція рухає курсор від початкових до кінцевих координат
    let dx = (endX - startX) / steps;
    let dy = (endY - startY) / steps;
    for (let i = 1; i <= steps; i++) {
        let x = startX + dx * i;
        let y = startY + dy * i;
        await page.mouse.move(x, y);
        await delayer(5); // Не змінювати
    }

    await page.mouse.click(endX, endY); // Клікаєм саме по КООРДИНАТАХ, а не на елемент
};

const scrollToElement = async (page, element) => {
    await page.evaluate((el) => {
        el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });
    }, element);
    await delayer(500);
};

module.exports = {
    delayer,
    dropdownSearch,
    getElementValue,
    smoothMouseMoveAndClick,
    scrollToElement,
    getTime,
};
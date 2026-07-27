const deleteProduct = (btn) => {
    console.log("Clicked");
    const productId = btn.parentNode.querySelector("[name='productId']").value;
    const csrfToken = btn.parentNode.querySelector("[name='_csrf']").value;

    const productElement = btn.closest("article");

    fetch(`/admin/product/${productId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "CSRF-Token": csrfToken,
        },
    })
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            productElement.remove();
        })
        .catch((err) => console.log(err));
};

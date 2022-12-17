function addToCart(productId) {
     $.ajax({
       url: "/add-to-cart/" + productId,
       method: "get",
       success: (response) => {
         if (response.status) {
           let count = $("#cartCount").html();
           count = parseInt(count) + 1;
           $("#cartCount").html(count);
           // alert  messege
           $("#alerts").append(
             '<div  class="alert alert-success alert-dismissible fade show" role="alert"> Item Added to Cart! <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
           );
         }
       },
     });
   }

   function addToWishlist(productId) {
     $.ajax({
       url: "/add-to-wishlist/" + productId,
       method: "get",
       success: (response) => {
         if (response.status) {
           let count = $("#wishlistCount").html();
           count = parseInt(count) + 1;
           $("#wishlistCount").html(count);
           // alert  messege
           $("#alerts").append(
             '<div  class="alert alert-success alert-dismissible fade show" role="alert"> Item Added to Wishlist! <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
           );
         }
       },
     });
   }
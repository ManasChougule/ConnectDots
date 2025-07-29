
{
    // method to submit the form data for new post using AJAX
    let createPost = function(){
        let newPostForm = $('#postForm');

        newPostForm.submit(async function(e){
            e.preventDefault();
            const content = document.getElementById('postInput').value.trim();
            const imageInput = document.getElementById('imageInput');
            const imageFile = imageInput.files[0];
            let imageFileName = null;

            if(imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await fetch('/images/uploadImage', {
                    method: 'POST',
                    body: formData
                });
                if (!uploadRes.ok) {
                    alert('Image upload failed');
                    return false;
                }
                const uploadData = await uploadRes.json();
                imageFileName = uploadData.file.filename; 
            }

            $.ajax({
                type: 'post',
                url: '/posts/create',
                data: JSON.stringify({
                    content,
                    imageFileName
                }),
                contentType: 'application/json',
                success: function (data) {
                    if (data.data) {
                        let newPost = newPostDom(data.data.post, data.data.user.name,data.data.user.id);
                        $('#posts-list-container>ul').prepend(newPost);
                        deletePost($('.delete-post-button', newPost));
                        new PostComments(data.data.post._id);  // ← invoking comment constructor(AJAX submit handler) for freshly-added posts to dynamically add comment on this post & to dynamically delete comments on this new post
                        new ToggleLike($('.toggle-like-button', newPost));
                        document.getElementById('postForm').reset();
                        $('#selectedImageFileName').text('');
                        // alert('Post created successfully!');
                        new Noty({
                            theme: 'relax',
                            text: "Post published!",
                            type: 'success',
                            layout: 'topRight',
                            timeout: 1500
                        }).show();
                    } else {
                        alert('Post created but response is missing data.');
                    }
                },
                error: function (err) {
                    alert('Error while creating post: ' + err.message);
                }
            });

        });
    }

    // Make these globally accessible
    let newPostDom = function (post, user_name,user_id) {
        if (post.imageFileName) {
            post.imageUrl = `/images/fetchImage/${post.imageFileName}`;
        }

        console.log("post======",post);
        return $(`
            <li id="post-${post._id}" class="post-wrapper list-group-item border rounded p-3 mb-3">

            <!-- ─── Post Content ─────────────────────────────────────────── -->
            <div class="post d-flex flex-column gap-1">

                <!-- Delete button (if owner/admin) -->
                <a href="/posts/destroy/${post._id}" class="delete-post-button align-self-end">
                <i class="bi bi-trash-fill"></i>
                </a>

                ${post.imageUrl ? `
                <div class="imageDiv text-center my-3">
                    <img src="${post.imageUrl}" alt="Post image" class="img-fluid rounded" style="max-width: 100%; max-height: 400px; width: auto; height: auto; object-fit: contain;">
                </div>` : ''
                }

                <p class="mb-1 post-content">${post.content}</p>

                <div class="d-flex flex-wrap gap-3 small text-muted">

                <span style="font-weight: 600;">Author&nbsp:</span>
                <a href="/users/profile/${user_id}" 
                    class="text-decoration-none  rounded-4" style="font-weight: 600;margin-left: -0.5rem;">
                    <span><strong></strong>${user_name}</strong></span>
                </a>

                <a class="toggle-like-button like-button text-black-50"
                    data-likes="0"
                    href="/likes/toggle/?id=${post._id}&type=Post"
                    data-liked="false">
                    <i class="bi bi-heart-fill"></i>
                    <span>0</span>
                </a>
                </div>
            </div>

            <!-- ─── Comments ──────────────────────────────────────────────── -->
            <div class="post-comments mt-3">

                <form id="post-${post._id}-comments-form" class="d-flex gap-2 mb-3" action="/comments/create"
                    method="POST" onsubmit="return validateCommentForm()">
                <input type="text" name="content"
                        class="form-control" placeholder="Type a comment..." required>
                <input type="hidden" name="post" value="${post._id}">
                <div class="comment-footer d-flex flex-column">
                    <button type="submit" class="btn btn-sm btn-primary">Add Comment</button>
                    <span class="comment-hint small text-muted">Max 80 characters</span>
                </div>
                </form>

                <!-- Comments list will be dynamically appended here -->
                <ul id="post-comments-${post._id}" class="list-unstyled mb-0"></ul>
            </div>
            </li>
        `);
    }


    let deletePost = function(deleteLink) {
        $(deleteLink).each(function() {
            $(this).click(function(e) {
                e.preventDefault();
                let self = this;

                $.ajax({
                    type: 'get',
                    url: $(self).prop('href'),
                    success: function(data) {
                        $(`#post-${data.data.post_id}`).remove();
                    },
                    error: function(error) {
                        console.error("Error deleting post:", error);
                    }
                });
            });
        });
    };


    $(document).ready(function () {
        // Call deletePost on all existing delete buttons after the document loads
        createPost();
        deletePost($('.delete-post-button'));
    });

}


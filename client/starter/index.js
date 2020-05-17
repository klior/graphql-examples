const fullStar = "★";
const emptyStar = "☆";

const commitFragment = `
fragment commitFragment on Repository {
  ref(qualifiedName: "master") {
    target {
      ... on Commit {
        history {
          totalCount
        }
      }
    }
  }
}
`;

const queryRepoList = `
{
  viewer {
    name
    repos: repositoriesContributedTo(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      nodes {
        id
        name
        viewerHasStarred
        issues(states: OPEN) {
          totalCount
        }
        pullRequests(states: OPEN) {
          totalCount
        }
        ... commitFragment
      }
    }
  }
}
` + commitFragment;

const mutationAddStar = `
mutation ($id: ID!){
  addStar(input: {starrableId: $id}) {
    starrable {
      ... on Repository {
        name
        viewerHasStarred
      }
    }
  }
}
`;

const mutationRemoveStar = `
mutation ($id: ID!){
  removeStar(input: {starrableId: $id}) {
    starrable {
      ... on Repository {
        name
        viewerHasStarred
      }
    }
  }
}
`;

function gqlRequest(query, variables, onSuccess) {
  // MAKE GRAPHQL REQUEST
  $.post({
    url: "https://api.github.com/graphql",
    contentType: "application/json",
    headers: {
      Authorization: "bearer 674a6b67569ad7cf2c43e26e0745d278dc6c7f45"
    },
    data: JSON.stringify({
      query: query,
      variables: variables
    }),
    success: (response) => {
      if (response.errors) {
        console.log(response.errors);
      } else {
        console.log(response.data);
        onSuccess(response.data);
      }
    },
    error: (response) => console.log(response)
  });
}

function starHandler(element) {
  // STAR OR UNSTAR REPO BASED ON ELEMENT STATE
  if ($(element).text() === emptyStar) {
    gqlRequest(
      mutationAddStar,
      { id: element.id },
      (data) => {
        if (data.addStar.starrable.viewerHasStarred) {
          $(element).text(fullStar);
        }
      });
  } else {
    gqlRequest(
      mutationRemoveStar,
      { id: element.id },
      (data) => {
        if (!data.removeStar.starrable.viewerHasStarred) {
          $(element).text(emptyStar);
        }
      }
    );
  }
}

$(window).ready(function() {
  // GET NAME AND REPOSITORIES FOR VIEWER
  gqlRequest(queryRepoList, {}, (data)=> {
    const name = data.viewer.name;
    $("header h2").text(`Hello ${name}`);
    const repos = data.viewer.repos;
    if (repos.totalCount > 0) {
      $("ul.repos").empty();
      repos.nodes.forEach((node) => {
        const star = node.viewerHasStarred? fullStar : emptyStar;
        const repoElement = `
          <div>
            <h3>
              ${node.name}
              <span id=${node.id} class="star" onClick="starHandler(this)">${star}</span>
            </h3>
            <p>${node.issues.totalCount} open issues</p>
            <p>${node.pullRequests.totalCount} open pull requests</p>
            <p>${node.ref.target.history.totalCount} commits</p>
          </div>
        `
        $("ul.repos").append(`<li>${repoElement}</li>`);
      });
    }
  });
});
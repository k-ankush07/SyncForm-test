import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);

  const search = url.searchParams.get("search") || "";
  const after = url.searchParams.get("after") || null;

  const response = await admin.graphql(
    `#graphql
      query GetProducts(
        $first: Int!
        $after: String
        $search: String
      ) {
        products(
          first: $first
          after: $after
          query: $search
        ) {
          edges {
            node {
              id
              title
              description
              featuredImage {
                url
                altText
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    {
      variables: {
        first: 5,
        after,
        search: search || null,
      },
    }
  );

  const responseJson = await response.json();

  if (responseJson.errors) {
    return Response.json(
      {
        products: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        errors: responseJson.errors,
      },
      { status: 500 }
    );
  }

  const productData = responseJson.data.products;

  const products = productData.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    description: node.description,
    image: node.featuredImage?.url || "",
    imageAlt: node.featuredImage?.altText || node.title,
    price: node.variants.edges[0]?.node.price || "0",
    variantId: node.variants.edges[0]?.node.id || null,
  }));

  return Response.json({
    products,
    pageInfo: productData.pageInfo,
  });
}

import {
  Page,
  InlineStack,
  Text,
  Button,
  ButtonGroup,
  Box,
  Card,
  Popover,
  Select,
  BlockStack,
  Grid,
  Icon,
  Badge,
  ProgressBar,
  Checkbox,
  Divider,
  Tabs,
} from "@shopify/polaris";
import { useNavigate } from "react-router";
import { ViewIcon, EmailIcon, ChartLineIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import Gridcards from "../routes/components/Gridcards"

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("7");
  const [selected, setSelected] = useState(0);
  const dateOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ];

  //card data 
  const cards = [
    { title: "Total impressions", value: "14,820", icon: ViewIcon },
    { title: "Total submissions", value: "428", icon: EmailIcon },
    { title: "Total registration", value: "6", icon: ChartLineIcon },
  ]
  //forms data
  const forms = [
    {
      id: 1,
      title: "Contact Form",
      submissions: "284",
      impressions: "9,420",
      change: "+18 this week",
      conversion: "3.01% conv",
      chartTitle: "7-day submission velocity",
      chartValue: "Daily peak: 52",
      edited: "Edited 2h ago",
      color: "#008f75",
    },
    {
      id: 2,
      title: "Registration form",
      submissions: "144",
      impressions: "5,400",
      change: "+9 this week",
      conversion: "2.66% conv",
      chartTitle: "Approval backlog",
      chartValue: "6 awaiting review",
      edited: "Edited yesterday",
      color: "#3478f6",
    },
  ];
  //tabs
  const tabs = [
    {
      id: "all",
      content: "All (2)",
    },
    {
      id: "published",
      content: "Published (2)",
    },
    {
      id: "drafts",
      content: "Drafts (0)",
    },
  ];
  const [checked, setChecked] = useState({
    appembeed: true,
    layout: false,
  });

  const completedCount = Object.values(checked).filter(Boolean).length;
  const progress = (completedCount / 2) * 100;
  return (
    <Page >
      <InlineStack
        align="space-between"
        blockAlign="center"
        gap="400"
      >
        <Text variant="bodySm" as="h1" tone="subdued">
          DASHBOARD
        </Text>

        <InlineStack gap="200" blockAlign="center">
          <Select
            label="Date range"
            labelHidden
            options={dateOptions}
            value={dateRange}
            onChange={setDateRange}
          />

          <Button>
            <InlineStack gap="100" blockAlign="center">
              <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#008060",
                display: "inline-block"
              }} />
              All forms (2 live)
            </InlineStack>
          </Button>

          <Button variant="primary" onClick={() => {
            console.log("Create form clicked");
          }}>
            + Create form
          </Button>
        </InlineStack>
      </InlineStack>

      <Box paddingBlockStart="600">
        {/* <Box borderBlockStartWidth="025" borderColor="border" /> */}
      </Box>

      <Grid>
        {cards.map((card) => (
          <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
            <Gridcards id={card.id} title={card.title} value={card.value} icon={card.icon} />
          </Grid.Cell>
        ))}
      </Grid>

      {/* //checkboxes */}
      <Box paddingBlock={600}>
        <Card>
          <BlockStack gap="300">
            {/* Setup guide heading and progress */}
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <InlineStack>
                  <InlineStack gap={200} blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Setup guide
                    </Text>
                    <Badge tone="secondary">Step 3 of 4</Badge>
                  </InlineStack>
                </InlineStack>

                <Text as="p" variant="bodySm" tone="subdued">
                  Follow these essential steps to optimize from embeds and capture high intent buyers
                </Text>
              </BlockStack>

              <Box minWidth="160px">
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" alignment="end">
                    {completedCount} of 2 tasks complete ({progress}%)
                  </Text>
                  <div className="black-progress">
                    <ProgressBar progress={progress} size="small" />
                  </div>
                </BlockStack>
              </Box>
            </InlineStack>
            <Divider />
            {/* One outer card containing two checkbox rows */}

            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <span
                  onClick={() =>
                    setChecked((previous) => ({
                      ...previous,
                      appembeed: !previous.appembeed,
                    }))
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid #303030",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  {/* //show black dot when oly checked */}
                  {checked.appembeed && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#303030",
                      }}
                    />
                  )}
                </span>

                <Text as="span">Turn on app embed in Shopify theme</Text>
              </InlineStack>

              <Divider />

              <InlineStack gap="200" blockAlign="center">
                <span
                  onClick={() =>
                    setChecked((previous) => ({
                      ...previous,
                      layout: !previous.layout,
                    }))
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid #303030",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  {/* //show black dot when oly checked */}
                  {checked.layout && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#303030",
                      }}
                    />
                  )}
                </span>

                <Text as="span">Turn on app embed in Shopify theme</Text>
              </InlineStack>

            </BlockStack>

          </BlockStack>

        </Card>
      </Box>

      {/* //Your -form last-section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <div>
          <InlineStack align="space-between" blockAlign="center">

            <Box>
              <BlockStack gap="100">
                <InlineStack gap="300" blockAlign="center">
                  <Text as="h2" variant="headingSm">
                    Your Forms
                  </Text>
                  <Badge tone="success">2 active</Badge>
                </InlineStack>

                <Text as="p" variant="bodySm" tone="subdued">
                  Manage live storefront forms and monitor conversion metrics.
                </Text>
              </BlockStack>
            </Box>

            {/* tabs */}
            <Box
              background="bg-surface-secondary"
              padding="050"
              borderRadius="200"
            >
              <InlineStack gap="050" wrap={false}>
                {tabs.map((tab, index) => (
                  <Box
                    key={tab.id}
                    background={selected === index ? "bg-surface" : "bg-surface-secondary"}
                    padding="100"
                    borderRadius="100"
                  >
                    <button
                      onClick={() => setSelected(index)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "11px",
                        padding: "2px 4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tab.content}
                    </button>
                  </Box>
                ))}
              </InlineStack>
            </Box>
          </InlineStack>
          {/* BOX-Grid */}
          <Box paddingBlock={400}>
            <Grid>
              {forms.map((form) => (
                <Grid.Cell key={form.id} columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6, xl: 6 }}>
                  <Card>
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#008f75"
                        }} />
                        <Text as="h2" variant="headingSm">{form.title}</Text>
                      </InlineStack>

                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: 12, padding: 10, background: "#f6f6f7",
                        border: "1px solid #e1e3e5", borderRadius: 5
                      }}>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Submissions</Text>
                          <Text as="p" variant="headingMd">{form.submissions}</Text>
                          <Text as="p" variant="bodySm" tone="success">↗ {form.change}</Text>
                        </BlockStack>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Impressions</Text>
                          <Text as="p" variant="headingMd">{form.impressions}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{form.conversion}</Text>
                        </BlockStack>
                      </div>

                      <div style={{
                        padding: 10, border: "1px solid #f0f0f0",
                        borderRadius: 5, background: "#fafafa"
                      }}>
                        <InlineStack align="space-between" gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">{form.chartTitle}</Text>
                          <Text as="p" variant="bodySm" fontWeight="semibold">{form.chartValue}</Text>
                        </InlineStack>
                        <svg viewBox="0 0 250 45" width="100%" height="45" preserveAspectRatio="none">
                          <path
                            d={form.id === 1
                              ? "M0 38 Q35 35 60 29 T120 27 T180 18 T250 12 L250 45 L0 45 Z"
                              : "M0 32 Q40 40 70 30 T140 20 T210 24 T250 12 L250 45 L0 45 Z"}
                            fill={form.color}
                            opacity="0.1"
                          />
                          <path
                            d={form.id === 1
                              ? "M0 38 Q35 35 60 29 T120 27 T180 18 T250 12"
                              : "M0 32 Q40 40 70 30 T140 20 T210 24 T250 12"}
                            fill="none" stroke={form.color} strokeWidth="1.8"
                          />
                        </svg>
                      </div>

                      <Divider />

                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="p" variant="bodySm" tone="subdued">{form.edited}</Text>
                        <Button size="slim" onClick={() => console.log(form.title)}>
                          ▣ Entries
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Grid.Cell>
              ))}
            </Grid>
          </Box>
        </div>

        {/* // right side box */}
        <div>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                Need a hand with your form?
              </Text>

              <Text as="p" variant="bodySm" tone="subdued">
                Emma & David online • avg ~2 min reply
              </Text>

              <Box
                background="bg-surface-secondary"
                padding="300"
                borderRadius="200"
              >
                <Text as="p" variant="bodySm">
                  <b>Free Concierge Setup:</b>  We will write bespoke CSS to match your
                  Shopify store theme fonts, radius, and button hierarchy free of charge.
                </Text>
              </Box>

              <Button variant="primary" fullWidth>
                Chat with an expert
              </Button>

              <Button fullWidth>
                Explore documentation
              </Button>
            </BlockStack>
          </Card>
        </div>
      </div>
    </Page>
  );
}

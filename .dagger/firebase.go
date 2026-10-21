package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type firebaseTokenResponse struct {
	IDToken      string `json:"id_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    string `json:"expires_in"`
	TokenType    string `json:"token_type"`
	UserID       string `json:"user_id"`
	ProjectID    string `json:"project_id"`
}

// RefreshFirebaseIDToken exchanges a Firebase refresh token for a fresh ID token.
func RefreshFirebaseIDToken(ctx context.Context, apiKey, refreshToken string) (string, error) {
	if apiKey == "" {
		return "", fmt.Errorf("api key is required")
	}
	if refreshToken == "" {
		return "", fmt.Errorf("refresh token is required")
	}

	form := url.Values{}
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refreshToken)

	reqURL := "https://securetoken.googleapis.com/v1/token?key=" + url.QueryEscape(apiKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status %d: %s", resp.StatusCode, body)
	}

	var tokenResp firebaseTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("decoding response: %w", err)
	}
	if tokenResp.IDToken == "" {
		return "", fmt.Errorf("id_token missing in response")
	}

	return tokenResp.IDToken, nil
}
